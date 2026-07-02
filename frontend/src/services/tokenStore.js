// Lưu access token trong bộ nhớ (không lưu vào localStorage/sessionStorage)
// để tránh bị đánh cắp qua XSS.
let _accessToken = null;

export const getToken   = ()  => {
  if (window.Cypress) return _accessToken || window.localStorage.getItem("cypress_accessToken");
  return _accessToken;
};
export const setToken   = (t) => { _accessToken = t; };
export const clearToken = ()  => { _accessToken = null; };
