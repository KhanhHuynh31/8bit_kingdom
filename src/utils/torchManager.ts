// src/utils/torchManager.ts

export interface TorchState {
  alpha: number;
  userPreference: boolean | null; // null có nghĩa là đang chạy tự động
}

export const torchStates: Record<string, TorchState> = {};

export const toggleTorch = (id: string, isDarkTime: boolean) => {
  if (!torchStates[id]) {
    torchStates[id] = { 
      alpha: isDarkTime ? 1 : 0, 
      userPreference: !isDarkTime 
    };
  } else {
    // Nếu đang là null (tự động), thì lấy ngược lại của môi trường
    // Nếu đã có preference, thì đảo ngược preference đó
    const currentStatus = torchStates[id].userPreference ?? isDarkTime;
    torchStates[id].userPreference = !currentStatus;
  }
};