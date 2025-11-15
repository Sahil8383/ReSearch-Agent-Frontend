import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './store/slices/chatSlice';
import sessionReducer from './store/slices/sessionSlice';
import uiReducer from './store/slices/uiSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    sessions: sessionReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

