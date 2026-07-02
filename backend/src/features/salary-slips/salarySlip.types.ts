import type { SalarySlipModel } from "./salarySlip.model.js";

export type AwaitedSalarySlip = NonNullable<
  Awaited<ReturnType<typeof SalarySlipModel.findById>>
>;
