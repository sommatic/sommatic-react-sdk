import styled from 'styled-components';
import '@styles/fonts.css';
import '@styles/styles.css';

export const StandardContainer = styled.section`
  margin: 0 auto;
  min-width: 400px;

  @media (min-width: 768px) {
    max-width: 66.6667%; /* 8/12 */
  }

  @media (min-width: 992px) {
    max-width: 50%; /* 6/12 */
  }

  @media (min-width: 1200px) {
    max-width: 41.6667%; /* 5/12 */
  }
`;
