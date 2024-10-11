-- users 테이블 생성
CREATE TABLE users (
    id_user uuid PRIMARY KEY DEFAULT auth.uid(),
    email varchar UNIQUE NOT NULL,
    password varchar NOT NULL,
    name varchar NOT NULL,
    age int4 NOT NULL,
    goal int4 DEFAULT 10
);

-- drawing 테이블 생성
CREATE TABLE drawing (
    id_drawing serial PRIMARY KEY,
    id_user uuid REFERENCES users(id_user) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_path text NOT NULL
);

-- drawing 키워드 테이블 생성
CREATE TABLE drawing_kw (
    id_drawing int REFERENCES drawing(id_drawing) ON DELETE CASCADE,
    id_drawing_kw serial PRIMARY KEY,
    kw1 text,
    kw2 text,
    kw3 text,
    kw4 text,
    kw5 text,
    kw6 text,
    kw7 text,
    kw8 text,
    PRIMARY KEY (id_drawing, id_drawing_kw)
);

-- 책 테이블 생성
CREATE TABLE book (
    id_book serial PRIMARY KEY,
    id_user uuid REFERENCES users(id_user) ON DELETE CASCADE,
    title_kor text NOT NULL,
    kor_txt_path text NOT NULL,
    title_eng text NOT NULL,
    eng_txt_path text NOT NULL
);

-- 책 TTS 테이블 생성
CREATE TABLE book_tts (
    id_book_tts serial PRIMARY KEY,
    id_book int REFERENCES book(id_book) ON DELETE CASCADE,
    kor_mp3_path text NOT NULL,
    eng_mp3_path text NOT NULL
);
