import React from "react";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { AppContext } from "../../Context/AppContext";
import { useForm } from "react-hook-form";
import "./LoginPage.css";

type Props = {};

type LoginFormsInputs = {
  userName: string;
  password: string;
};

const validation = Yup.object().shape({
  userName: Yup.string().required("Username is required*"),
  password: Yup.string().required("Password is required*"), 
});

const LoginPage = (props: Props) => {
  const { login } = AppContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormsInputs>({ resolver: yupResolver(validation) });

  const handleLogin = (form: LoginFormsInputs) => {
    loginUser(form.userName, form.password);
  };

  return (
    <div className="form-container">
      <form className="form" onSubmit={handleSubmit(handleLogin)}>
         <h1 className="login-title">Login</h1>


      <label htmlFor="userName" className="flex-column">
        Username
      </label>


        <div className="inputForm">

          <input
            type="text"
            id="userName"
            placeholder="Username"
            {...register("userName")}
            className="input"
          />
        </div>
        {errors.userName && <p className="error">{errors.userName.message}</p>}

        <label htmlFor="password" className="flex-column">
          Password
        </label>

        <div className="inputForm">
          <input
            type="password"
            id="password"
            placeholder="••••••••"
            {...register("password")}
            className="input"
          />
        </div>
        {errors.password && <p className="error">{errors.password.message}</p>}

        <div className="flex-row">
          <a href="/reset-password" className="span">
            Forgot password?
          </a>
        </div>

        <button type="submit" className="button-submit">
          Sign in
        </button>

        <p className="p">
          Don’t have an account yet?{" "}
          <a href="/register" className="span">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
