# Database Schema for ClassEase

## Tables Required for Onboarding Flow

### 1. `classes`
Stores information about each class/classroom.

```sql
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  school_name TEXT NOT NULL,
  city TEXT NOT NULL,
  year TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  invite_code TEXT UNIQUE,
  total_budget DECIMAL(10, 2),
  budget_type TEXT CHECK (budget_type IN ('per-child', 'total')),
  budget_amount DECIMAL(10, 2),
  number_of_children INTEGER,
  number_of_staff INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own classes"
  ON classes FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create classes"
  ON classes FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own classes"
  ON classes FOR UPDATE
  USING (created_by = auth.uid());
```

### 2. `children`
Stores information about children in each class.

```sql
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view children in their classes"
  ON children FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage children in their classes"
  ON children FOR ALL
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );
```

### 3. `parents`
Stores information about parents.

```sql
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Parents can view their own data"
  ON parents FOR SELECT
  USING (user_id = auth.uid());
```

### 4. `child_parents`
Junction table linking children to their parents.

```sql
CREATE TABLE child_parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  relationship TEXT CHECK (relationship IN ('parent1', 'parent2')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(child_id, parent_id)
);

-- Enable RLS
ALTER TABLE child_parents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view parent-child relationships in their classes"
  ON child_parents FOR SELECT
  USING (
    child_id IN (
      SELECT c.id FROM children c
      INNER JOIN classes cl ON c.class_id = cl.id
      WHERE cl.created_by = auth.uid()
    )
  );
```

### 5. `staff`
Stores information about teachers and assistants.

```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('teacher', 'assistant')),
  birthday DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view staff in their classes"
  ON staff FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage staff in their classes"
  ON staff FOR ALL
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );
```

### 6. `events`
Stores events for each class.

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'birthdays', 'holidays', 'end-year-gifts', etc.
  icon TEXT,
  allocated_budget DECIMAL(10, 2),
  spent_amount DECIMAL(10, 2) DEFAULT 0,
  event_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view events in their classes"
  ON events FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can manage events in their classes"
  ON events FOR ALL
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
  );
```

### 7. `class_members`
Stores which users are members of which classes (admins, parents, etc.).

```sql
CREATE TABLE class_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'parent', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

-- Enable RLS
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view members in their classes"
  ON class_members FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM classes WHERE created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );
```

## Additional Functions

### Generate Invite Code Function
```sql
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
BEGIN
  RETURN lower(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Update trigger to generate invite code on class creation
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_class_invite_code
  BEFORE INSERT ON classes
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();
```

## Usage Instructions

1. Run these migrations in your Supabase SQL editor
2. Ensure RLS is enabled on all tables
3. Test policies with different user roles
4. Update the onboarding component to save data to these tables
