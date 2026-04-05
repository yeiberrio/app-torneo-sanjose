-- AlterTable
ALTER TABLE "users" ADD COLUMN     "customRoleId" TEXT;

-- CreateTable
CREATE TABLE "custom_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "viewModule" BOOLEAN NOT NULL DEFAULT false,
    "create" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "edit" BOOLEAN NOT NULL DEFAULT false,
    "delete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "default_role_permissions" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "module" TEXT NOT NULL,
    "viewModule" BOOLEAN NOT NULL DEFAULT false,
    "create" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "edit" BOOLEAN NOT NULL DEFAULT false,
    "delete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "default_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_roles_name_key" ON "custom_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_module_key" ON "role_permissions"("roleId", "module");

-- CreateIndex
CREATE UNIQUE INDEX "default_role_permissions_role_module_key" ON "default_role_permissions"("role", "module");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "custom_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "custom_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
