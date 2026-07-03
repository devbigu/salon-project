import React, { useState } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { Row, Col, Button } from "reactstrap";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  BackTo,
  PreviewCard,
} from "@/components/Component";
// ---------------- STEPS ----------------

const PersonalForm = ({ next }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useFormContext();

  return (
    <form className="content clearfix" onSubmit={handleSubmit(next)}>
      <Row className="gy-4">
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="first-name">
              First Name
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                id="first-name"
                className="form-control"
                {...register('firstName', { required: true })} />
              {errors.firstName && <span className="invalid">This field is required</span>}
            </div>
          </div>
        </Col>
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="last-name">
              Last Name
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                id="last-name"
                className="form-control"
                {...register('lastName', { required: true })} />
              {errors.lastName && <span className="invalid">This field is required</span>}
            </div>
          </div>
        </Col>
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                id="email"
                className="form-control"
                {...register('email', {
                  required: true,
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email",
                  },
                })} />
                {errors.email && errors.email.type === "required" &&  <span className="invalid">This field is required</span>}
                {errors.email && errors.email.type === "pattern" && <span className="invalid">{errors.email.message}</span>}
            </div>
          </div>
        </Col>
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="phone-no">
              Mobile Number
            </label>
            <div className="form-control-wrap">
              <input
                type="number"
                id="phone-no"
                className="form-control"
                {...register('phone', { required: true })} />
              {errors.phone && <span className="invalid">This field is required</span>}
            </div>
          </div>
        </Col>
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="city">
              City
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                id="city"
                className="form-control"
                {...register('city', { required: true })} />
              {errors.city && <span className="invalid">This field is required</span>}
            </div>
          </div>
        </Col>
      </Row>
      <div className="actions clearfix">
        <ul>
          <li>
            <Button color="primary" type="submit">
              Next
            </Button>
          </li>
        </ul>
      </div>
    </form>
  );
};

const UserSettings = ({ next, prev }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useFormContext();

  const password = watch("password");

  return (
    <form className="content clearfix" onSubmit={handleSubmit(next)}>
      <Row className="gy-4">
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                id="username"
                className="form-control"
                {...register('username', { required: true })} />
              {errors.username && <span className="invalid">This field is required</span>}
            </div>
          </div>
        </Col>
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="form-control-wrap">
              <input
                type="password"
                id="password"
                className="form-control"
                {...register('password', {
                  required: "This field is required",
                  minLength: {
                    value: 6,
                    message: "Password must have at least 6 characters",
                  },
                })} />
              {errors.password && <span className="invalid">{errors.password.message}</span>}
            </div>
          </div>
        </Col>
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPass">
              Confirm Password
            </label>
            <div className="form-control-wrap">
              <input
                type="password"
                id="confirmPass"
                className="form-control"
                {...register('confirmPass', {
                  required: "This field is required",
                  minLength: {
                    value: 6,
                    message: "Password must have at least 6 characters",
                  },
                })} />
              {errors.confirmPass && <span className="invalid">{errors.confirmPass.message}</span>}
            </div>
          </div>
        </Col>
        <Col md="12">
          <div className="custom-control custom-checkbox">
            <input
              type="checkbox"
              className="custom-control-input"
              {...register('terms', { required: true })}
              id="fw-policy" />
            {errors.terms && <span className="invalid">This field is required</span>}
            <label className="custom-control-label" htmlFor="fw-policy">
              I agreed Terms and policy
            </label>
          </div>
        </Col>
      </Row>
      <div className="actions clearfix">
        <ul>
          <li>
            <Button color="primary" type="submit">
              Next
            </Button>
          </li>
          <li>
            <Button color="primary" onClick={prev}>
              Previous
            </Button>
          </li>
        </ul>
      </div>
    </form>
  );
};

const PaymentInfo = ({ next, prev }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useFormContext();

  return (
    <form className="content clearfix" onSubmit={handleSubmit(next)}>
      <Row className="gy-4">
        <Col md="12">
          <div className="form-group">
            <label className="form-label" htmlFor="fw-token-address">
              Token Address
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                className="form-control"
                id="fw-token-address"
                {...register('tokenAddress', { required: true })}/>
              {errors.tokenAddress && <span className="invalid">This field is required</span>}
            </div>
          </div>
        </Col>
        <Col md="12">
          <label className="form-label">I want to contribute</label>
          <ul className="d-flex flex-wrap g-2">
            <li>
              <div className="custom-control custom-radio">
                <input
                  type="radio"
                  className="custom-control-input"
                  {...register('ethRadio', { required: true })}
                  id="fw-lt1eth" />
                {errors.ethRadio && <span className="invalid">This field is required</span>}
                <label className="custom-control-label" htmlFor="fw-lt1eth">
                  Less than 1 ETH
                </label>
              </div>
            </li>
            <li>
              <div className="custom-control custom-radio">
                <input
                  type="radio"
                  className="custom-control-input"
                  {...register('ethRadio', { required: true })}
                  id="fw-ov1eth" />
                <label className="custom-control-label" htmlFor="fw-ov1eth">
                  Over than 1 ETH
                </label>
              </div>
            </li>
          </ul>
        </Col>
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="fw-telegram-username">
              Telegram Username
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                className="form-control required"
                id="fw-telegram-username"
                {...register('telegram', { required: true })} />
              {errors.telegram && <span className="invalid">This field is required</span>}
            </div>
          </div>
        </Col>
      </Row>
      <div className="actions clearfix">
        <ul>
          <li>
            <Button color="primary" type="submit">
              Next
            </Button>
          </li>
          <li>
            <Button color="primary" onClick={prev}>
              Previous
            </Button>
          </li>
        </ul>
      </div>
    </form>
  );
};

const Success = () => (
  <div className="d-flex justify-content-center align-items-center p-3">
    <BlockTitle tag="h6" className="text-center">
      Thank you for submitting form
    </BlockTitle>
  </div>
);

const PersonalFormVr = ({ next }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useFormContext();

  return (
    <form className="content clearfix" onSubmit={handleSubmit(next)}>
      <Row className="gy-4">
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="first-name-vr">
              First Name
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                id="first-name-vr"
                className="form-control"
                {...register('firstNameVr', { required: true })} />
              {errors.firstNameVr && <span className="invalid">This field is required</span>}
            </div>
          </div>
        </Col>
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="last-name-vr">
              Last Name
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                id="last-name-vr"
                className="form-control"
                {...register('lastNameVr', { required: true })} />
              {errors.lastNameVr && <span className="invalid">This field is required</span>}
            </div>
          </div>
        </Col>
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="email-vr">
              Email Address
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                id="email-vr"
                className="form-control"
                {...register('emailVr', {
                  required: true,
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email",
                  },
                })} />
                {errors.emailVr && errors.emailVr.type === "required" &&  <span className="invalid">This field is required</span>}
                {errors.emailVr && errors.emailVr.type === "pattern" && <span className="invalid">{errors.emailVr.message}</span>}
            </div>
          </div>
        </Col>
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="phone-no-vr">
              Mobile Number
            </label>
            <div className="form-control-wrap">
              <input
                type="number"
                id="phone-no-vr"
                className="form-control"
                {...register('phoneVr', { required: true })} />
              {errors.phoneVr && <span className="invalid">This field is required</span>}
            </div>
          </div>
        </Col>
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="city-vr">
              City
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                id="city-vr"
                className="form-control"
                {...register('cityVr', { required: true })} />
              {errors.cityVr && <span className="invalid">This field is required</span>}
            </div>
          </div>
        </Col>
      </Row>
      <div className="actions clearfix">
        <ul>
          <li>
            <Button color="primary" type="submit">
              Next
            </Button>
          </li>
        </ul>
      </div>
    </form>
  );
};

const UserSettingsVr = ({ next, prev }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useFormContext();

  const password = watch("password");

  return (
    <form className="content clearfix" onSubmit={handleSubmit(next)}>
      <Row className="gy-4">
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="username-vr">
              Username
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                id="username-vr"
                className="form-control"
                {...register('usernameVr', { required: true })} />
              {errors.usernameVr && <span className="invalid">This field is required</span>}
            </div>
          </div>
        </Col>
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="password-vr">
              Password
            </label>
            <div className="form-control-wrap">
              <input
                type="password"
                id="password-vr"
                className="form-control"
                {...register('passwordVr', {
                  required: "This field is required",
                  minLength: {
                    value: 6,
                    message: "Password must have at least 6 characters",
                  },
                })} />
              {errors.passwordVr && <span className="invalid">{errors.passwordVr.message}</span>}
            </div>
          </div>
        </Col>
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="confirm-pass-vr">
              Confirm Password
            </label>
            <div className="form-control-wrap">
              <input
                type="password"
                id="confirm-pass-vr"
                className="form-control"
                {...register('confirmPassVr', {
                  required: "This field is required",
                  minLength: {
                    value: 6,
                    message: "Password must have at least 6 characters",
                  },
                })} />
              {errors.confirmPassVr && <span className="invalid">{errors.confirmPassVr.message}</span>}
            </div>
          </div>
        </Col>
        <Col md="12">
          <div className="custom-control custom-checkbox">
            <input
              type="checkbox"
              className="custom-control-input"
              {...register('termsVr', { required: true })}
              id="fw-policy-vr" />
            {errors.termsVr && <span className="invalid">This field is required</span>}
            <label className="custom-control-label" htmlFor="fw-policy-vr">
              I agreed Terms and policy
            </label>
          </div>
        </Col>
      </Row>
      <div className="actions clearfix">
        <ul>
          <li>
            <Button color="primary" type="submit">
              Next
            </Button>
          </li>
          <li>
            <Button color="primary" onClick={prev}>
              Previous
            </Button>
          </li>
        </ul>
      </div>
    </form>
  );
};

const PaymentInfoVr = ({ next, prev }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useFormContext();

  return (
    <form className="content clearfix" onSubmit={handleSubmit(next)}>
      <Row className="gy-4">
        <Col md="12">
          <div className="form-group">
            <label className="form-label" htmlFor="fw-token-address-vr">
              Token Address
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                className="form-control"
                id="fw-token-address-vr"
                {...register('tokenAddressVr', { required: true })}/>
              {errors.tokenAddressVr && <span className="invalid">This field is required</span>}
            </div>
          </div>
        </Col>
        <Col md="12">
          <label className="form-label">I want to contribute</label>
          <ul className="d-flex flex-wrap g-2">
            <li>
              <div className="custom-control custom-radio">
                <input
                  type="radio"
                  className="custom-control-input"
                  {...register('ethRadioVr', { required: true })}
                  id="fw-lt1eth-vr" />
                {errors.ethRadioVr && <span className="invalid">This field is required</span>}
                <label className="custom-control-label" htmlFor="fw-lt1eth-vr">
                  Less than 1 ETH
                </label>
              </div>
            </li>
            <li>
              <div className="custom-control custom-radio">
                <input
                  type="radio"
                  className="custom-control-input"
                  {...register('ethRadioVr', { required: true })}
                  id="fw-ov1eth-vr" />
                <label className="custom-control-label" htmlFor="fw-ov1eth-vr">
                  Over than 1 ETH
                </label>
              </div>
            </li>
          </ul>
        </Col>
        <Col md="6">
          <div className="form-group">
            <label className="form-label" htmlFor="fw-telegram-username-vr">
              Telegram Username
            </label>
            <div className="form-control-wrap">
              <input
                type="text"
                className="form-control required"
                id="fw-telegram-username-vr"
                {...register('telegramVr', { required: true })} />
              {errors.telegramVr && <span className="invalid">This field is required</span>}
            </div>
          </div>
        </Col>
      </Row>
      <div className="actions clearfix">
        <ul>
          <li>
            <Button color="primary" type="submit">
              Next
            </Button>
          </li>
          <li>
            <Button color="primary" onClick={prev}>
              Previous
            </Button>
          </li>
        </ul>
      </div>
    </form>
  );
};

const SuccessVr = () => (
  <div className="d-flex justify-content-center align-items-center p-3">
    <BlockTitle tag="h6" className="text-center">
      Thank you for submitting form
    </BlockTitle>
  </div>
);

const StepHeader = ({ step, steps }) => {
  return (
    <div className="steps clearfix">
      <ul>
        {steps.map((label, i) => {
          const isCurrent = i === step;
          const isDone = i < step;

          return (
            <li
              key={i}
              className={[
                i === 0 ? "first" : "",
                i === steps.length - 1 ? "last" : "",
                isDone ? "done" : "",
                isCurrent ? "current" : "",
              ].join(" ")}
            >
              <span className="number">{String(i + 1).padStart(2, "0")}</span>
              <h5>{label}</h5>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const WizardForm = () => {
  const methods = useForm({
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: "",
      username: "",
      password: "",
      confirmPass: "",
      terms: false,
      tokenAddress: "",
      ethRadio: "",
      telegram: "",
    },
  });
  const methodsVr = useForm({
    mode: "onChange",
    defaultValues: {
      firstNameVr: "",
      lastNameVr: "",
      emailVr: "",
      phoneVr: "",
      cityVr: "",
      usernameVr: "",
      passwordVr: "",
      confirmPassVr: "",
      termsVr: false,
      tokenAddressVr: "",
      ethRadioVr: "",
      telegramVr: "",
    },
  });

  const [step, setStep] = useState(0);
  const [stepVr, setStepVr] = useState(0);

  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => s - 1);

  const nextVr = () => setStepVr((s) => s + 1);
  const prevVr = () => setStepVr((s) => s - 1);

  const steps = [
    <PersonalForm key="personal" next={next} />,
    <UserSettings key="settings" next={next} prev={prev} />,
    <PaymentInfo key="payment" next={next} prev={prev} />,
    <Success key="success" />,
  ];

  const stepsVr = [
    <PersonalFormVr key="personal" next={nextVr} />,
    <UserSettingsVr key="settings" next={nextVr} prev={prevVr} />,
    <PaymentInfoVr key="payment" next={nextVr} prev={prevVr} />,
    <SuccessVr key="success" />,
  ];

  return (
    <React.Fragment>
      <Head title="Wizard Form" />
      <Content page="component">
        <BlockHead size="lg" wide="sm">
          <BlockHeadContent>
            <BackTo link="/components" icon="arrow-left">
              Components
            </BackTo>
            <BlockTitle tag="h2" className="fw-normal">
              Wizard Form
            </BlockTitle>
            <BlockDes>
              <p className="lead">
                You can simply make step based form with{" "}
                <a href="https://react-hook-form.com/" target="_blank" rel="noreferrer">
                  React Hook Form
                </a>{" "}
                package for form validation.
              </p>
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        <Block size="lg">
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h5">Wizard Form - Basic</BlockTitle>
              <p>A basic demonstration of wizard form basic.</p>
            </BlockHeadContent>
          </BlockHead>
          <PreviewCard>
            <div className="nk-wizard nk-wizard-simple is-alter wizard clearfix">
              <FormProvider {...methods}>
                  <StepHeader steps={["Personal", "Account", "Payment", "Done"]} step={step} />
                  {steps[step]}
              </FormProvider>
            </div>
          </PreviewCard>
        </Block>

        <Block size="lg">
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h5">Wizard Form - Vertical</BlockTitle>
              <p>A basic demonstration of wizard form in a vertical format.</p>
            </BlockHeadContent>
          </BlockHead>
          <PreviewCard>
            <div className="nk-wizard nk-wizard-simple is-vertical is-alter wizard clearfix">
              <FormProvider {...methodsVr}>
                  <StepHeader steps={["Personal", "Account", "Payment", "Done"]} step={stepVr} />
                    {stepsVr[stepVr]}
              </FormProvider>
            </div>
          </PreviewCard>
        </Block>
      </Content>
    </React.Fragment>
    
  );
};

export default WizardForm;
