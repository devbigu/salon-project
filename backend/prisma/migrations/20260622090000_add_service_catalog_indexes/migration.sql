-- CreateIndex
CREATE INDEX "MainService_salonId_idx" ON "MainService"("salonId");

-- CreateIndex
CREATE INDEX "MainService_status_idx" ON "MainService"("status");

-- CreateIndex
CREATE INDEX "Service_salonId_idx" ON "Service"("salonId");

-- CreateIndex
CREATE INDEX "Service_branchId_idx" ON "Service"("branchId");

-- CreateIndex
CREATE INDEX "Service_mainServiceId_idx" ON "Service"("mainServiceId");

-- CreateIndex
CREATE INDEX "Service_status_idx" ON "Service"("status");
