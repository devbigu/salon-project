/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Col,
  FormGroup,
  Input,
  Label,
  Row,
  Spinner,
} from "reactstrap";
import { Button, Icon } from "@/components/Component";
import PageShell from "@/components/salon/PageShell";
import StatusBadge from "@/components/salon/StatusBadge";
import { useAuth } from "@/auth/AuthContext";
import { salonApi } from "@/services/salonApi";
import {
  formatDate,
  formatMoney,
  toLocalInput,
} from "@/utils/salonFormat";

const JobCartDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [refs, setRefs] = useState({ staff: [], services: [] });
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    startTime: "",
    staffId: "",
    bookingNote: "",
  });
  const [serviceId, setServiceId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await salonApi.jobCarts.get(id);
      const next = response.data;
      setCart(next);
      setForm({
        customerName: next.customer?.name || "",
        phone: next.customer?.phone || "",
        startTime: toLocalInput(next.startTime),
        staffId: next.staffId || "",
        bookingNote: next.bookingNote || "",
      });
      const referenceResponse = await salonApi.jobCarts.references({
        ...(next.salonId ? { salonId: next.salonId } : {}),
        ...(next.branchId ? { branchId: next.branchId } : {}),
      });
      setRefs(referenceResponse.data || { staff: [], services: [] });
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const availableServices = useMemo(() => {
    const existing = new Set(
      (cart?.items || []).map((item) => item.serviceId)
    );
    return refs.services.filter((service) => !existing.has(service.id));
  }, [cart?.items, refs.services]);

  const run = async (action) => {
    setWorking(true);
    setError("");
    try {
      await action();
      await load();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setWorking(false);
    }
  };

  const save = () =>
    run(() =>
      salonApi.jobCarts.update(id, {
        customerName: form.customerName,
        phone: form.phone,
        startTime: new Date(form.startTime).toISOString(),
        staffId: form.staffId || null,
        bookingNote: form.bookingNote || null,
      })
    );

  const confirm = () => {
    if (
      !window.confirm(
        "Confirm this job cart? This completes the appointment, deducts service consumables and issues the invoice."
      )
    ) {
      return;
    }
    run(() => salonApi.jobCarts.confirm(id));
  };

  const cancel = () => {
    if (!window.confirm("Cancel this active job cart?")) return;
    run(() => salonApi.jobCarts.cancel(id));
  };

  const canApplyCoupon = [
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "RECEPTIONIST",
  ].includes(user?.role);
  const canOpenInvoice = [
    "SUPER_ADMIN",
    "SALON_ADMIN",
    "RECEPTIONIST",
  ].includes(user?.role);
  const active = cart?.status === "ACTIVE";
  const invoice = cart?.invoice;
  const membershipDiscount = Number(invoice?.discountAmount || 0);

  return (
    <PageShell
      title={cart ? `Job Cart ${cart.jobCartId}` : "Job Cart"}
      description={
        cart
          ? `${cart.customer?.name || "Walk-in"} • ${formatDate(
              cart.startTime,
              true
            )}`
          : "Walk-in appointment and draft invoice"
      }
      tools={
        <>
          <Button color="light" outline onClick={() => navigate("/job-carts")}>
            <Icon name="arrow-left" /> Back
          </Button>
          {cart && <StatusBadge value={cart.status} />}
        </>
      }
    >
      {error && <Alert color="danger">{error}</Alert>}
      {loading && !cart ? (
        <div className="text-center py-5">
          <Spinner color="primary" />
        </div>
      ) : cart ? (
        <Row className="g-4">
          <Col lg="8">
            <div className="card card-bordered mb-4">
              <div className="card-inner">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="mb-0">Customer & Schedule</h5>
                  <span className="text-soft">
                    {cart.branch?.name || "No branch"}
                  </span>
                </div>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label>Customer Name</Label>
                      <Input
                        disabled={!active}
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
                  <Col md="6">
                    <FormGroup>
                      <Label>Phone Number</Label>
                      <Input
                        disabled={!active}
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
                </Row>
                <Row>
                  <Col md="6">
                    <FormGroup>
                      <Label>Date & Start Time</Label>
                      <Input
                        type="datetime-local"
                        disabled={!active}
                        value={form.startTime}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            startTime: event.target.value,
                          }))
                        }
                      />
                    </FormGroup>
                  </Col>
                  <Col md="6">
                    <FormGroup>
                      <Label>Staff (optional)</Label>
                      <Input
                        type="select"
                        disabled={!active}
                        value={form.staffId}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            staffId: event.target.value,
                          }))
                        }
                      >
                        <option value="">Unassigned</option>
                        {refs.staff.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} — {member.jobRole}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                </Row>
                <FormGroup>
                  <Label>Note</Label>
                  <Input
                    type="textarea"
                    rows="2"
                    disabled={!active}
                    value={form.bookingNote}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        bookingNote: event.target.value,
                      }))
                    }
                  />
                </FormGroup>
                {active && (
                  <Button color="primary" outline disabled={working} onClick={save}>
                    Save Details
                  </Button>
                )}
              </div>
            </div>

            <div className="card card-bordered">
              <div className="card-inner">
                <h5>Services</h5>
                {active && (
                  <div className="d-flex gap-2 mb-4">
                    <Input
                      type="select"
                      value={serviceId}
                      onChange={(event) => setServiceId(event.target.value)}
                    >
                      <option value="">Select a service</option>
                      {availableServices.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} — {formatMoney(service.price)}
                        </option>
                      ))}
                    </Input>
                    <Button
                      color="primary"
                      disabled={!serviceId || working}
                      onClick={() =>
                        run(async () => {
                          await salonApi.jobCarts.addItem(id, serviceId);
                          setServiceId("");
                        })
                      }
                    >
                      Add
                    </Button>
                  </div>
                )}
                <div className="table-responsive">
                  <table className="table table-tranx">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Duration</th>
                        <th className="text-end">Price</th>
                        {active && <th className="text-end">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {cart.items.length ? (
                        cart.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.serviceName}</td>
                            <td>
                              {item.durationValue || 0}{" "}
                              {(item.durationUnit || "MINUTES").toLowerCase()}
                            </td>
                            <td className="text-end">
                              {formatMoney(item.price)}
                            </td>
                            {active && (
                              <td className="text-end">
                                <Button
                                  color="danger"
                                  outline
                                  size="sm"
                                  disabled={working}
                                  onClick={() =>
                                    run(() =>
                                      salonApi.jobCarts.removeItem(id, item.id)
                                    )
                                  }
                                >
                                  Remove
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={active ? 4 : 3}
                            className="text-center text-soft py-4"
                          >
                            No services added yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Col>

          <Col lg="4">
            <div className="card card-bordered mb-4">
              <div className="card-inner">
                <h5>Invoice Summary</h5>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span>Subtotal</span>
                  <strong>{formatMoney(invoice?.subtotalAmount)}</strong>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span>Membership / discount</span>
                  <strong>-{formatMoney(membershipDiscount)}</strong>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span>Coupon</span>
                  <strong>
                    -{formatMoney(invoice?.couponDiscountAmount)}
                  </strong>
                </div>
                <div className="d-flex justify-content-between py-3 fs-5">
                  <span>Total</span>
                  <strong>{formatMoney(invoice?.totalAmount)}</strong>
                </div>
                <div className="small text-soft mb-3">
                  Membership: {cart.customer?.membership?.name || "None"}
                  <br />
                  Wallet: {formatMoney(cart.customer?.walletBalance)}
                  <br />
                  Loyalty points: {cart.customer?.loyaltyPoints || 0}
                </div>

                {active && canApplyCoupon && (
                  <div className="mb-4">
                    <Label>Coupon</Label>
                    {!invoice?.couponId ? (
                      <div className="d-flex gap-2">
                        <Input
                          placeholder="Coupon code"
                          value={couponCode}
                          onChange={(event) =>
                            setCouponCode(event.target.value.toUpperCase())
                          }
                        />
                        <Button
                          color="primary"
                          outline
                          disabled={!couponCode.trim() || working}
                          onClick={() =>
                            run(() =>
                              salonApi.invoices.applyCoupon(
                                invoice.id,
                                couponCode
                              )
                            )
                          }
                        >
                          Apply
                        </Button>
                      </div>
                    ) : (
                      <Button
                        color="danger"
                        outline
                        disabled={working}
                        onClick={() =>
                          run(() =>
                            salonApi.invoices.removeCoupon(invoice.id)
                          )
                        }
                      >
                        Remove {invoice.couponCodeSnapshot}
                      </Button>
                    )}
                  </div>
                )}

                {active ? (
                  <div className="d-grid gap-2">
                    <Button
                      color="success"
                      disabled={working || !cart.items.length}
                      onClick={confirm}
                    >
                      {working && <Spinner size="sm" className="me-1" />}
                      Confirm Job Cart
                    </Button>
                    <Button
                      color="danger"
                      outline
                      disabled={working}
                      onClick={cancel}
                    >
                      Cancel Job Cart
                    </Button>
                  </div>
                ) : invoice && canOpenInvoice ? (
                  <Link to={`/billing/invoices/${invoice.id}`}>
                    <Button color="primary" block>
                      Open Invoice / Payment
                    </Button>
                  </Link>
                ) : invoice ? (
                  <p className="text-soft small mb-0">
                    Invoice issued. Payment access follows the existing billing
                    role policy.
                  </p>
                ) : null}
              </div>
            </div>
          </Col>
        </Row>
      ) : null}
    </PageShell>
  );
};

export default JobCartDetails;
