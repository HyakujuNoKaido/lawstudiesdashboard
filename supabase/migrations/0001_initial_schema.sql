-- Activation de l'extension uuid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table Profiles
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT NOT NULL,
    university_name TEXT,
    program_name TEXT,
    program_level TEXT CHECK (program_level IN ('Bachelor', 'Master', 'Doctorat')),
    required_ects INTEGER,
    current_semester INTEGER,
    grade_min NUMERIC(3,2) DEFAULT 1.00,
    grade_max NUMERIC(3,2) DEFAULT 6.00,
    passing_grade NUMERIC(3,2) DEFAULT 4.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    course_code TEXT,
    ects INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('En cours', 'Validé', 'À reprendre')),
    teacher_name TEXT,
    color_key TEXT DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table Flashcards
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    course_id UUID REFERENCES courses(id),
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    tags TEXT[],
    due_at TIMESTAMPTZ DEFAULT NOW(),
    interval_days NUMERIC DEFAULT 0,
    ease_factor NUMERIC DEFAULT 2.5,
    repetitions INTEGER DEFAULT 0,
    lapses INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour requêtes fréquentes
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_flashcards_user_id_due_at ON flashcards(user_id, due_at);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité (Seul l'utilisateur accède à ses données)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own courses" ON courses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own flashcards" ON flashcards FOR ALL USING (auth.uid() = user_id);
