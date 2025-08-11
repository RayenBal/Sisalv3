import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  body {
    background-color: #121212;
    color: #FFFFFF;
    font-family: 'Segoe UI', sans-serif;
    margin: 0;
    padding: 0;
  }
`;

export const theme = {
  primary: "#00BFFF",
  secondary: "#282c34",
  text: "#FFFFFF"
};

