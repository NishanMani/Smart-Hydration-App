export const fakeLogin = (email, password) => {
  if (email === "girish@gmail.com" && password === "admin123") {
    return {
      id: 1,
      name: "Girish",
      email: "girish@gmail.com",
      role: "Admin",
    };
  }

  if (email === "user@example.com" && password === "user123") {
    return {
      id: 2,
      name: "Swaroop",
      email: "swaroop@gmail.com",
      role: "User",
    };
  }

  if (email === "1" && password === "1") {
    return {
      id: 3,
      name: "Vijay",
      email: "vijay@gmail.com",
      role: "User",
    };
  }

  return null;
};