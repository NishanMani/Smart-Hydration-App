import { createContext, useReducer } from "react";

export const AuthContext = createContext();

const initialAuthState = {
  isAuthenticated: false,
  user: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return { isAuthenticated: true, user: action.payload };
    case "LOGOUT":
      return { isAuthenticated: false, user: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

