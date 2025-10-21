DROP TABLE IF EXISTS
    "Users", "Posts", "Comments", "Likes", "Comment_Likes",
    "Friendships", "Follows", "Notifications", "Reports",
    "Tags", "Hashtags", "Post_Hashtags" CASCADE;

-- delete ENUM
DROP TYPE IF EXISTS role_enum;
DROP TYPE IF EXISTS privacy_enum;
DROP TYPE IF EXISTS analysis_status_enum;
DROP TYPE IF EXISTS friendship_status_enum;
DROP TYPE IF EXISTS notification_type_enum;
DROP TYPE IF EXISTS report_status_enum;

-- =============================================
-- 1. create ENUM
-- =============================================

CREATE TYPE role_enum AS ENUM ('user', 'admin');
CREATE TYPE privacy_enum AS ENUM ('public', 'friends', 'private');
CREATE TYPE analysis_status_enum AS ENUM ('positive', 'neutral', 'negative');
CREATE TYPE friendship_status_enum AS ENUM ('pending', 'accepted', 'blocked');
CREATE TYPE notification_type_enum AS ENUM ('like_post', 'like_comment', 'comment', 'reply', 'friend_request', 'follow', 'tag');
CREATE TYPE report_status_enum AS ENUM ('pending', 'resolved');

-- =============================================
-- 2. create TABLES
-- =============================================

CREATE TABLE "Users" (
                         "user_id" SERIAL PRIMARY KEY,
                         "username" VARCHAR(50) UNIQUE NOT NULL,
                         "email" VARCHAR(100) UNIQUE NOT NULL,
                         "password_hash" VARCHAR(255) NOT NULL,
                         "full_name" VARCHAR(100) NOT NULL,
                         "avatar_url" VARCHAR(255),
                         "bio" TEXT,
                         "role" role_enum NOT NULL DEFAULT 'user',
                         "created_at" TIMESTAMPTZ DEFAULT NOW(),
                         "updated_at" TIMESTAMPTZ
);

CREATE TABLE "Posts" (
                         "post_id" SERIAL PRIMARY KEY,
                         "user_id" INT NOT NULL,
                         "content" TEXT,
                         "media_url" VARCHAR(255),
                         "privacy" privacy_enum NOT NULL DEFAULT 'public',
                         "created_at" TIMESTAMPTZ DEFAULT NOW(),
                         "updated_at" TIMESTAMPTZ,

                         FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE
);

CREATE TABLE "Comments" (
                            "comment_id" SERIAL PRIMARY KEY,
                            "post_id" INT NOT NULL,
                            "user_id" INT NOT NULL,
                            "parent_comment_id" INT,
                            "content" TEXT NOT NULL,
                            "analysis_status" analysis_status_enum,
                            "created_at" TIMESTAMPTZ DEFAULT NOW(),
                            "updated_at" TIMESTAMPTZ,

                            FOREIGN KEY ("post_id") REFERENCES "Posts"("post_id") ON DELETE CASCADE,
                            FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE,
                            FOREIGN KEY ("parent_comment_id") REFERENCES "Comments"("comment_id") ON DELETE CASCADE
);

CREATE TABLE "Likes" (
                         "user_id" INT NOT NULL,
                         "post_id" INT NOT NULL,
                         "created_at" TIMESTAMPTZ DEFAULT NOW(),

                         PRIMARY KEY ("user_id", "post_id"),
                         FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE,
                         FOREIGN KEY ("post_id") REFERENCES "Posts"("post_id") ON DELETE CASCADE
);

CREATE TABLE "Comment_Likes" (
                                 "user_id" INT NOT NULL,
                                 "comment_id" INT NOT NULL,
                                 "created_at" TIMESTAMPTZ DEFAULT NOW(),

                                 PRIMARY KEY ("user_id", "comment_id"),
                                 FOREIGN KEY ("user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE,
                                 FOREIGN KEY ("comment_id") REFERENCES "Comments"("comment_id") ON DELETE CASCADE
);

CREATE TABLE "Friendships" (
                               "user_one_id" INT NOT NULL,
                               "user_two_id" INT NOT NULL,
                               "status" friendship_status_enum NOT NULL,
                               "created_at" TIMESTAMPTZ DEFAULT NOW(),
                               "updated_at" TIMESTAMPTZ,

                               PRIMARY KEY ("user_one_id", "user_two_id"),
                               FOREIGN KEY ("user_one_id") REFERENCES "Users"("user_id") ON DELETE CASCADE,
                               FOREIGN KEY ("user_two_id") REFERENCES "Users"("user_id") ON DELETE CASCADE,
                               CHECK ("user_one_id" < "user_two_id") -- Ngăn (A, B) và (B, A) cùng tồn tại
);

CREATE TABLE "Follows" (
                           "follower_id" INT NOT NULL,
                           "following_id" INT NOT NULL,
                           "created_at" TIMESTAMPTZ DEFAULT NOW(),

                           PRIMARY KEY ("follower_id", "following_id"),
                           FOREIGN KEY ("follower_id") REFERENCES "Users"("user_id") ON DELETE CASCADE,
                           FOREIGN KEY ("following_id") REFERENCES "Users"("user_id") ON DELETE CASCADE,
                           CHECK ("follower_id" <> "following_id") -- Ngăn người dùng tự theo dõi
);

CREATE TABLE "Notifications" (
                                 "notification_id" SERIAL PRIMARY KEY,
                                 "recipient_id" INT NOT NULL,
                                 "sender_id" INT NOT NULL,
                                 "type" notification_type_enum NOT NULL,
                                 "target_id" INT NOT NULL,
                                 "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
                                 "created_at" TIMESTAMPTZ DEFAULT NOW(),

                                 FOREIGN KEY ("recipient_id") REFERENCES "Users"("user_id") ON DELETE CASCADE,
                                 FOREIGN KEY ("sender_id") REFERENCES "Users"("user_id") ON DELETE CASCADE,
                                 CHECK ("recipient_id" <> "sender_id") -- Ngăn tự thông báo
);

CREATE TABLE "Reports" (
                           "report_id" SERIAL PRIMARY KEY,
                           "reporter_id" INT NOT NULL,
                           "post_id" INT,
                           "comment_id" INT,
                           "reason" TEXT NOT NULL,
                           "status" report_status_enum NOT NULL DEFAULT 'pending',
                           "created_at" TIMESTAMPTZ DEFAULT NOW(),

                           FOREIGN KEY ("reporter_id") REFERENCES "Users"("user_id") ON DELETE CASCADE,
                           FOREIGN KEY ("post_id") REFERENCES "Posts"("post_id") ON DELETE SET NULL,
                           FOREIGN KEY ("comment_id") REFERENCES "Comments"("comment_id") ON DELETE SET NULL,
                           CHECK (("post_id" IS NOT NULL AND "comment_id" IS NULL) OR ("post_id" IS NULL AND "comment_id" IS NOT NULL)) -- Phải báo cáo 1 trong 2
);

CREATE TABLE "Tags" (
                        "tag_id" SERIAL PRIMARY KEY,
                        "post_id" INT,
                        "comment_id" INT,
                        "tagged_user_id" INT NOT NULL,

                        FOREIGN KEY ("post_id") REFERENCES "Posts"("post_id") ON DELETE CASCADE,
                        FOREIGN KEY ("comment_id") REFERENCES "Comments"("comment_id") ON DELETE CASCADE,
                        FOREIGN KEY ("tagged_user_id") REFERENCES "Users"("user_id") ON DELETE CASCADE,

                        CHECK (("post_id" IS NOT NULL AND "comment_id" IS NULL) OR ("post_id" IS NULL AND "comment_id" IS NOT NULL)), -- Tương tự Reports
                        UNIQUE ("post_id", "tagged_user_id"), -- Không tag 1 người 2 lần trong 1 post
                        UNIQUE ("comment_id", "tagged_user_id") -- Không tag 1 người 2 lần trong 1 comment
);

CREATE TABLE "Hashtags" (
                            "hashtag_id" SERIAL PRIMARY KEY,
                            "tag_text" VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE "Post_Hashtags" (
                                 "post_id" INT NOT NULL,
                                 "hashtag_id" INT NOT NULL,

                                 PRIMARY KEY ("post_id", "hashtag_id"),
                                 FOREIGN KEY ("post_id") REFERENCES "Posts"("post_id") ON DELETE CASCADE,
                                 FOREIGN KEY ("hashtag_id") REFERENCES "Hashtags"("hashtag_id") ON DELETE CASCADE
);

-- =============================================
-- 3. create INDEXES
-- =============================================

CREATE INDEX ON "Posts" ("user_id");
CREATE INDEX ON "Comments" ("post_id");
CREATE INDEX ON "Comments" ("user_id");
CREATE INDEX ON "Comments" ("parent_comment_id");
CREATE INDEX ON "Notifications" ("recipient_id");
CREATE INDEX ON "Reports" ("reporter_id");
CREATE INDEX ON "Reports" ("post_id");
CREATE INDEX ON "Reports" ("comment_id");
CREATE INDEX ON "Tags" ("tagged_user_id");
CREATE INDEX ON "Post_Hashtags" ("hashtag_id");
CREATE INDEX ON "Hashtags" ("tag_text");

-- =============================================
-- 4. triggers
-- =============================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON "Users"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON "Posts"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON "Comments"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON "Friendships"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
