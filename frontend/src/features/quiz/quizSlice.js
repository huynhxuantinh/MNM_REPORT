import { createSlice } from "@reduxjs/toolkit";

const initialState = { data: null, loading: false, error: null };

const slice = createSlice({
  name: "FEATURE",
  initialState,
  reducers: {},
});

export default slice.reducer;
