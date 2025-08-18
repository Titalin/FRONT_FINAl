import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Roboto', sans-serif;
    background-color: #0191FF; /* Fondo azul adaptado al logo */
    color: ${({ theme }) => theme.palette.text.primary};
    line-height: 1.5;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  ul {
    list-style: none;
  }

  .MuiPaper-root {
    transition: box-shadow 0.3s ease-in-out;
  }
`;

export default GlobalStyles;
