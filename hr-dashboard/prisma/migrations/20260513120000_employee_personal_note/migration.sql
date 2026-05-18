-- CreateTable
CREATE TABLE "EmployeePersonalNote" (
    "id" UUID NOT NULL,
    "employeeKey" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeePersonalNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmployeePersonalNote_employeeKey_idx" ON "EmployeePersonalNote"("employeeKey");
