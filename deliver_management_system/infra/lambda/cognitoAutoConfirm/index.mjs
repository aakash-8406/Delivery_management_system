// Cognito Pre Sign-up trigger — auto-confirms users without email verification
export const handler = async (event) => {
  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;
  return event;
};
