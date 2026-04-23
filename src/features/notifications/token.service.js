export function saveUserToken(token) {
  const userName = localStorage.getItem("userName");
  const userType = localStorage.getItem("userType");

  const data = {
    userName,
    userType,
    token,
  };

  localStorage.setItem("push_user", JSON.stringify(data));

  console.log("Token salvo:", data);
}