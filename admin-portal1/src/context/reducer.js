export const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };

    case "LOGOUT":
      return {
        user: null,
        isAuthenticated: false,
      };

    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };

    default:
      return state;
  }
};

export const themeReducer = (state, action) => {
  switch (action.type) {
    case "TOGGLE_THEME":
      return {
        theme: state.theme === "light" ? "dark" : "light",
      };

    default:
      return state;
  }
};