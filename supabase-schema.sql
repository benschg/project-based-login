-- GDPR-compliant database schema for project-based login
-- No PII stored outside of Supabase Auth tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional user preferences (minimal data, user-controlled)
CREATE TABLE user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT, -- Optional, user-controlled
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  language TEXT DEFAULT 'en',
  email_notifications BOOLEAN DEFAULT true,
  data_processing_consent BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table (no owner personal info)
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  privacy_level TEXT DEFAULT 'private' CHECK (privacy_level IN ('private', 'team', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project members (anonymous references only)
CREATE TABLE project_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- GDPR audit log (for compliance tracking)
CREATE TABLE gdpr_audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('consent_given', 'consent_withdrawn', 'data_exported', 'data_deleted', 'account_created')),
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_audit_log ENABLE ROW LEVEL SECURITY;

-- User preferences: Users can only see/edit their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Projects: Users can see projects they own or are members of
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() IN (
      SELECT user_id FROM project_members 
      WHERE project_id = projects.id
    )
  );

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners can update projects" ON projects
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Project owners can delete projects" ON projects
  FOR DELETE USING (auth.uid() = owner_id);

-- Project members: Users can see members of projects they belong to
CREATE POLICY "Users can view project members" ON project_members
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT owner_id FROM projects WHERE id = project_id
    ) OR
    auth.uid() IN (
      SELECT user_id FROM project_members pm2 
      WHERE pm2.project_id = project_members.project_id
    )
  );

CREATE POLICY "Project owners and admins can manage members" ON project_members
  FOR ALL USING (
    auth.uid() IN (
      SELECT owner_id FROM projects WHERE id = project_id
    ) OR
    auth.uid() IN (
      SELECT user_id FROM project_members 
      WHERE project_id = project_members.project_id 
      AND role IN ('owner', 'admin')
    )
  );

-- GDPR audit log: Users can view their own audit records
CREATE POLICY "Users can view own audit log" ON gdpr_audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit log" ON gdpr_audit_log
  FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_gdpr_audit_log_user_id ON gdpr_audit_log(user_id);
CREATE INDEX idx_gdpr_audit_log_created_at ON gdpr_audit_log(created_at DESC);

-- Function to automatically add project owner as member
CREATE OR REPLACE FUNCTION add_project_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_members (project_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.owner_id, 'owner', NEW.owner_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_project_owner_as_member_trigger
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION add_project_owner_as_member();

-- Function to log GDPR actions
CREATE OR REPLACE FUNCTION log_gdpr_action(
  p_user_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO gdpr_audit_log (user_id, action, details, ip_address, user_agent)
  VALUES (p_user_id, p_action, p_details, p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export user data (GDPR compliance)
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_data JSONB;
  auth_data JSONB;
  preferences_data JSONB;
  projects_data JSONB;
  memberships_data JSONB;
  audit_data JSONB;
BEGIN
  -- Get auth data
  SELECT to_jsonb(au) INTO auth_data
  FROM auth.users au
  WHERE au.id = p_user_id;
  
  -- Get user preferences
  SELECT to_jsonb(up) INTO preferences_data
  FROM user_preferences up
  WHERE up.user_id = p_user_id;
  
  -- Get owned projects
  SELECT COALESCE(jsonb_agg(to_jsonb(p)), '[]'::jsonb) INTO projects_data
  FROM projects p
  WHERE p.owner_id = p_user_id;
  
  -- Get project memberships
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'project_id', pm.project_id,
      'role', pm.role,
      'permissions', pm.permissions,
      'joined_at', pm.joined_at,
      'project_name', pr.name
    )
  ), '[]'::jsonb) INTO memberships_data
  FROM project_members pm
  JOIN projects pr ON pr.id = pm.project_id
  WHERE pm.user_id = p_user_id;
  
  -- Get audit log
  SELECT COALESCE(jsonb_agg(to_jsonb(gal)), '[]'::jsonb) INTO audit_data
  FROM gdpr_audit_log gal
  WHERE gal.user_id = p_user_id;
  
  -- Build complete export
  user_data := jsonb_build_object(
    'export_date', NOW(),
    'user_id', p_user_id,
    'auth_data', auth_data,
    'preferences', preferences_data,
    'owned_projects', projects_data,
    'project_memberships', memberships_data,
    'audit_log', audit_data
  );
  
  -- Log the export action
  PERFORM log_gdpr_action(p_user_id, 'data_exported', jsonb_build_object('export_size_kb', pg_column_size(user_data) / 1024));
  
  RETURN user_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete user data (GDPR right to erasure)
CREATE OR REPLACE FUNCTION delete_user_data(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  project_count INTEGER;
BEGIN
  -- Check if user owns projects with other members
  SELECT COUNT(*) INTO project_count
  FROM projects p
  WHERE p.owner_id = p_user_id
  AND EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = p.id 
    AND pm.user_id != p_user_id
  );
  
  IF project_count > 0 THEN
    -- Cannot delete if user owns projects with other members
    RETURN FALSE;
  END IF;
  
  -- Log deletion action before deleting
  PERFORM log_gdpr_action(p_user_id, 'data_deleted');
  
  -- Delete user data (cascading will handle related records)
  DELETE FROM auth.users WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;