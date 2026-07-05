/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Col,
  Form,
  FormGroup,
  Input,
  Label,
  Row,
  Spinner,
} from "reactstrap";
import { Button, Icon } from "@/components/Component";
import PageShell from "@/components/salon/PageShell";
import { useAuth } from "@/auth/AuthContext";
import { salonApi } from "@/services/salonApi";
import { formatDate, formatMoney } from "@/utils/salonFormat";

const nowParts = () => {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return {
    date: local.toISOString().slice(0, 10),
    time: local.toISOString().slice(11, 16),
  };
};

const JobCartCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const initial = nowParts();
  const [form, setForm] = useState({
    salonId: "",
    branchId: "",
    customerName: "",
    phone: "",
    date: initial.date,
    time: initial.time,
    staffId: "",
    serviceIds: [],
    packageIds: [],
    bookingNote: "",
  });
  const [refs, setRefs] = useState({
    salons: [],
    branches: [],
    staff: [],
    services: [],
    packages: [],
  });
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customerSummary, setCustomerSummary] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);

  const lookupCustomer = async () => {
    if (!form.phone.trim()) return;
    setLookingUp(true);
    setError("");
    try {
      const response = await salonApi.jobCarts.customerSummary({
        phone: form.phone,
      });
      setCustomerSummary(response.data);
      if (response.data?.customerName) {
        setForm((current) => ({
          ...current,
          customerName: response.data.customerName,
        }));
      }
    } catch (lookupError) {
      setCustomerSummary(null);
      setError(lookupError.message);
    } finally {
      setLookingUp(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoadingRefs(true);
    salonApi.jobCarts
      .references({
        ...(form.salonId ? { salonId: form.salonId } : {}),
        ...(form.branchId ? { branchId: form.branchId } : {}),
      })
      .then((response) => {
        if (!active) return;
        setRefs(response.data || {
          salons: [],
          branches: [],
          staff: [],
          services: [],
          packages: [],
        });
        if (
          user?.role !== "SUPER_ADMIN" &&
          !form.branchId &&
          response.data?.branches?.length === 1
        ) {
          setForm((current) => ({
            ...current,
            branchId: response.data.branches[0].id,
          }));
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoadingRefs(false);
      });
    return () => {
      active = false;
    };
  }, [form.salonId, form.branchId, user?.role]);

  const selectedServices = useMemo(
    () =>
      refs.services.filter((service) =>
        form.serviceIds.includes(service.id)
      ),
    [refs.services, form.serviceIds]
  );
  const subtotal = selectedServices.reduce(
    (sum, service) => sum + Number(service.price || 0),
    0
  );
  const selectedPackages = useMemo(
    () =>
      (refs.packages || []).filter((servicePackage) =>
        form.packageIds.includes(servicePackage.id)
      ),
    [refs.packages, form.packageIds]
  );
  const packageSubtotal = selectedPackages.reduce(
    (sum, servicePackage) =>
      sum + Number(servicePackage.specialPrice || 0),
    0
  );
  const duration = selectedServices.reduce(
    (sum, service) =>
      sum +
      Number(service.durationValue || 0) *
        (service.durationUnit === "HOURS" ? 60 : 1),
    0
  );

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const startTime = new Date(`${form.date}T${form.time}:00`);
      if (Number.isNaN(startTime.getTime())) {
        throw new Error("Choose a valid date and start time");
      }
      const response = await salonApi.jobCarts.create({
        ...(form.salonId ? { salonId: form.salonId } : {}),
        branchId: form.branchId,
        customerName: form.customerName,
        phone: form.phone,
        startTime: startTime.toISOString(),
        ...(form.staffId ? { staffId: form.staffId } : {}),
        serviceIds: form.serviceIds,
        ...(form.bookingNote ? { bookingNote: form.bookingNote } : {}),
      });
      for (const packageId of form.packageIds) {
        await salonApi.jobCarts.addItem(response.data.id, {
          itemType: "PACKAGE",
          packageId,
          ...(form.staffId ? { staffId: form.staffId } : {}),
        });
      }
      navigate(`/job-carts/${response.data.id}`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Create Job Cart"
      description="Start a walk-in appointment and its draft invoice."
      tools={
        <Button color="light" outline onClick={() => navigate("/job-carts")}>
          <Icon name="arrow-left" /> Back
        </Button>
      }
    >
      {error && <Alert color="danger">{error}</Alert>}
      <Form onSubmit={submit}>
        <Row className="g-4">
          <Col lg="8">
            <div className="card card-bordered">
              <div className="card-inner">
                <h5 className="mb-4">Walk-in Details</h5>
                {user?.role === "SUPER_ADMIN" && (
                  <FormGroup>
                    <Label>Salon</Label>
                    <Input
                      type="select"
                      required
                      value={form.salonId}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          salonId: event.target.value,
                          branchId: "",
                          staffId: "",
                          serviceIds: [],
                          packageIds: [],
                        }))
                      }
                    >
                      <option value="">Select salon</option>
                      {refs.salons.map((salon) => (
                        <option key={salon.id} value={salon.id}>
                          {salon.name}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                )}
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label>Phone Number</Label>
                      <Input
                        required
                        placeholder="Customer phone"
                        value={form.phone}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label>Customer Name</Label>
                      <Input
                        required
                        placeholder="Customer name"
                        value={form.customerName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            customerName: event.target.value,
                          }))
                        }
                      />
                    </FormGroup>
                  </Col>
                </Row>
                <div className="mb-3">
                  <Button
                    type="button"
                    color="primary"
                    outline
                    size="sm"
                    disabled={lookingUp || form.phone.trim().length < 7}
                    onClick={lookupCustomer}
                  >
                    {lookingUp && <Spinner size="sm" className="me-1" />}
                    Lookup Customer
                  </Button>
                </div>
                <Row>
                  <Col md="4">
                    <FormGroup>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        required
                        value={form.date}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            date: event.target.value,
                          }))
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        required
                        value={form.time}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            time: event.target.value,
                          }))
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col md="4">
                    <FormGroup>
                      <Label>Branch</Label>
                      <Input
                        type="select"
                        required
                        value={form.branchId}
                        disabled={loadingRefs}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            branchId: event.target.value,
                            staffId: "",
                            serviceIds: [],
                            packageIds: [],
                          }))
                        }
                      >
                        <option value="">Select branch</option>
                        {refs.branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                </Row>
                <FormGroup>
                  <Label>Staff (optional)</Label>
                  <Input
                    type="select"
                    value={form.staffId}
                    disabled={!form.branchId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        staffId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Assign later</option>
                    {refs.staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} — {member.jobRole}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label>Add Packages</Label>
                  <Input
                    type="select"
                    multiple
                    value={form.packageIds}
                    disabled={!form.branchId}
                    style={{ minHeight: 120 }}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        packageIds: Array.from(
                          event.target.selectedOptions,
                          (option) => option.value
                        ),
                      }))
                    }
                  >
                    {(refs.packages || []).map((servicePackage) => (
                      <option key={servicePackage.id} value={servicePackage.id}>
                        {servicePackage.name} —{" "}
                        {formatMoney(servicePackage.specialPrice)}
                      </option>
                    ))}
                  </Input>
                  <small className="text-soft">
                    Selected packages are added to the draft invoice after the
                    cart is created.
                  </small>
                </FormGroup>
                <FormGroup>
                  <Label>Add Services</Label>
                  <Input
                    type="select"
                    multiple
                    value={form.serviceIds}
                    disabled={!form.branchId}
                    style={{ minHeight: 180 }}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        serviceIds: Array.from(
                          event.target.selectedOptions,
                          (option) => option.value
                        ),
                      }))
                    }
                  >
                    {refs.services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} — {formatMoney(service.price)}
                      </option>
                    ))}
                  </Input>
                  <small className="text-soft">
                    Hold Ctrl/Cmd to select multiple services. You can also add
                    services after creating the cart.
                  </small>
                </FormGroup>
                <FormGroup>
                  <Label>Booking Note</Label>
                  <Input
                    type="textarea"
                    rows="3"
                    value={form.bookingNote}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        bookingNote: event.target.value,
                      }))
                    }
                  />
                </FormGroup>
              </div>
            </div>
          </Col>
          <Col lg="4">
            <div className="card card-bordered position-sticky" style={{ top: 90 }}>
              <div className="card-inner">
                <h5>Cart Summary</h5>
                {customerSummary && (
                  <div className="alert alert-light border mb-3">
                    <strong>{customerSummary.customerName}</strong>
                    <div className="small mt-2">
                      Last visit: {formatDate(customerSummary.lastVisitDate)}
                      <br />
                      Total visits: {customerSummary.totalVisits}
                      <br />
                      Loyalty: {customerSummary.loyaltyPoints} points
                      <br />
                      Wallet: {formatMoney(customerSummary.walletBalance)}
                      <br />
                      Outstanding:{" "}
                      {formatMoney(customerSummary.outstandingBalance)}
                      <br />
                      Membership:{" "}
                      {customerSummary.membershipName || "None"}
                      <br />
                      Preferred staff:{" "}
                      {customerSummary.preferredStaff?.staffName || "Not known"}
                    </div>
                    {customerSummary.activePackages?.length > 0 && (
                      <div className="small mt-2">
                        <strong>Available packages</strong>
                        {customerSummary.activePackages.map((item) => (
                          <div key={item.customerPackageId}>
                            {item.packageName} — valid to{" "}
                            {formatDate(item.validUntil)}
                            {item.soldByStaffName
                              ? ` — sold by ${item.soldByStaffName}`
                              : ""}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {customerSummary?.activePackages?.length > 0 && (
                  <div className="small mb-3">
                    {customerSummary.activePackages.map((item) => (
                      <div
                        key={`${item.customerPackageId}-balances`}
                        className="border rounded p-2 mb-2"
                      >
                        <strong>{item.packageName} balances</strong>
                        {(item.serviceBalances || []).map((balance) => (
                          <div
                            key={balance.balanceId}
                            className="d-flex justify-content-between mt-1"
                          >
                            <span>{balance.serviceName}</span>
                            <span>
                              {balance.usedQuantity}/
                              {balance.includedQuantity} used •{" "}
                              {balance.remainingQuantity} remaining
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span>Services</span>
                  <strong>{selectedServices.length}</strong>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span>Packages</span>
                  <strong>{selectedPackages.length}</strong>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span>Duration</span>
                  <strong>{duration} min</strong>
                </div>
                <div className="d-flex justify-content-between py-3">
                  <span>Estimated subtotal</span>
                  <strong>
                    {formatMoney(subtotal + packageSubtotal)}
                  </strong>
                </div>
                <p className="text-soft small">
                  Membership discount is calculated when the draft invoice is
                  created. Coupon and loyalty actions remain in the invoice
                  flow.
                </p>
                <Button
                  type="submit"
                  color="primary"
                  block
                  disabled={saving || loadingRefs}
                >
                  {saving && <Spinner size="sm" className="me-1" />}
                  Create Job Cart
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Form>
    </PageShell>
  );
};

export default JobCartCreate;
