import * as React from "react";
import WelcomeSection from "../sections/WelcomeSection";
import { createGlobalStyle, ThemeProvider } from "styled-components";

const GlobalStyle = createGlobalStyle`
*, *::before, *::after {
  margin:0;
  padding:0;
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif; 
}
`;

const IndexPage = () => {
  return( 
    <>
      <GlobalStyle />
      <WelcomeSection />
    </>
    );
};

export default IndexPage;

export function Head() {
  return (
    <title>Dominik Personal Website</title>
  )
}
