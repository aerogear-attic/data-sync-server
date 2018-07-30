DROP TABLE IF EXISTS "Meme";
CREATE TABLE "Meme" (
  "id"       SERIAL                 NOT NULL,
  "photoUrl" CHARACTER VARYING(500) NOT NULL,
  "owner" CHARACTER VARYING(100) NOT NULL,
  "likes" CHARACTER VARYING(100) NOT NULL,
  "ownerId" SERIAL NOT NULL  references Profile(id)
);

DROP TABLE IF EXISTS "Comment";
CREATE TABLE "Comment" (
  "id"       SERIAL                 NOT NULL,
  "owner" CHARACTER VARYING(100) NOT NULL,
  "comment" CHARACTER VARYING(500) NOT NULL
  "memeId"  SERIAL NOT NULL references Meme(id),
);

DROP TABLE IF EXISTS "Profile";
CREATE TABLE "Profile" (
  "id"    SERIAL                 NOT NULL,
  "email" CHARACTER VARYING(100) NOT NULL,
  "displayName" CHARACTER VARYING(100) NOT NULL,
  "pictureUrl" CHARACTER VARYING(500) NOT NULL
);
