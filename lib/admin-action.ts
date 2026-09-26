export type AdminActionResult = {
  success: boolean;
  message?: string;
  error?: string;
  redirectTo?: string;
};

export function actionSuccess(message: string, redirectTo?: string): AdminActionResult {
  return { success: true, message, redirectTo };
}

export function actionError(error: string): AdminActionResult {
  return { success: false, error };
}
