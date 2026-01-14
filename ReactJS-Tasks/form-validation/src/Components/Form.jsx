import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "./Form.css";

const UserForm = () => {
  const [submittedData, setSubmittedData] = useState(null);

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    mobile: Yup.string()
      .matches(/^[0-9]{10}$/, "Mobile must be 10 digits")
      .required("Mobile is required"),
    gender: Yup.string().required("Select gender"),
    address: Yup.string().min(5, "Minimum 5 characters").required("Address is required"),
  });

  return (
    <div className="container">
      <h2>User Registration Form</h2>

      <Formik
        initialValues={{
          name: "",
          email: "",
          mobile: "",
          gender: "",
          address: "",
        }}
        validationSchema={validationSchema}
        onSubmit={(values, actions) => {
          setSubmittedData(values);
          actions.resetForm();
        }}
      >
        <Form className="form">

          <label>Name</label>
          <Field name="name" />
          <ErrorMessage name="name" component="div" className="error" />

          <label>Email</label>
          <Field name="email" />
          <ErrorMessage name="email" component="div" className="error" />

          <label>Mobile</label>
          <Field name="mobile" />
          <ErrorMessage name="mobile" component="div" className="error" />

          <label>Gender</label>
          <div className="radio-group">
            <label className="g1" >
              <Field type="radio" name="gender" value="male" />  Male
            </label>
            <label className="g1">
              <Field type="radio" name="gender" value="female" /> Female
            </label>
          </div>
          <ErrorMessage name="gender" component="div" className="error" />

          <label>Address</label>
          <Field as="textarea" name="address" />
          <ErrorMessage name="address" component="div" className="error" />

          <button type="submit">Submit</button>

        </Form>
      </Formik>

      {submittedData && (
        <div className="result">
          <h3>Submitted Data</h3>
          <p><b>Name:</b> {submittedData.name}</p>
          <p><b>Email:</b> {submittedData.email}</p>
          <p><b>Mobile:</b> {submittedData.mobile}</p>
          <p><b>Gender:</b> {submittedData.gender}</p>
          <p><b>Address:</b> {submittedData.address}</p>
        </div>
      )}
    </div>
  );
};

export default UserForm;
