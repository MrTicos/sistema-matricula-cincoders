-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Curso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "chMinObrigatoria" INTEGER NOT NULL,
    "chMinPerfil" INTEGER NOT NULL,
    "chMinLivre" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Aluno" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,
    CONSTRAINT "Aluno_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Aluno_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Disciplina" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargaHoraria" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "EstruturaCurricular" (
    "cursoId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,

    PRIMARY KEY ("cursoId", "disciplinaId"),
    CONSTRAINT "EstruturaCurricular_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "Curso" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EstruturaCurricular_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Professor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Turma" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "disciplinaId" INTEGER NOT NULL,
    "professorId" INTEGER NOT NULL,
    "vagasTotais" INTEGER NOT NULL,
    CONSTRAINT "Turma_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Turma_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Matricula" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alunoId" INTEGER NOT NULL,
    "turmaId" INTEGER NOT NULL,
    "situacao" TEXT NOT NULL DEFAULT 'ATIVA',
    "criadaEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceladaEm" DATETIME,
    CONSTRAINT "Matricula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Matricula_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Historico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "alunoId" INTEGER NOT NULL,
    "disciplinaId" INTEGER NOT NULL,
    "situacao" TEXT NOT NULL,
    CONSTRAINT "Historico_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Historico_disciplinaId_fkey" FOREIGN KEY ("disciplinaId") REFERENCES "Disciplina" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Aluno_usuarioId_key" ON "Aluno"("usuarioId");

-- CreateIndex
CREATE INDEX "Aluno_cursoId_idx" ON "Aluno"("cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "Disciplina_codigo_key" ON "Disciplina"("codigo");

-- CreateIndex
CREATE INDEX "EstruturaCurricular_disciplinaId_idx" ON "EstruturaCurricular"("disciplinaId");

-- CreateIndex
CREATE UNIQUE INDEX "Professor_email_key" ON "Professor"("email");

-- CreateIndex
CREATE INDEX "Turma_disciplinaId_idx" ON "Turma"("disciplinaId");

-- CreateIndex
CREATE INDEX "Turma_professorId_idx" ON "Turma"("professorId");

-- CreateIndex
CREATE INDEX "Matricula_alunoId_situacao_idx" ON "Matricula"("alunoId", "situacao");

-- CreateIndex
CREATE INDEX "Matricula_turmaId_situacao_idx" ON "Matricula"("turmaId", "situacao");

-- CreateIndex
CREATE INDEX "Historico_alunoId_disciplinaId_idx" ON "Historico"("alunoId", "disciplinaId");

-- CreateIndex
CREATE INDEX "Historico_alunoId_situacao_idx" ON "Historico"("alunoId", "situacao");
