import * as React from 'react';
import styled from 'styled-components';
import { colors } from '../values/variables';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';

const SectionContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: ${colors.dark};
    border: 10px solid white;
`

const ContentContainer = styled.div`
    max-width: 900px;
    display: flex;
    flex-direction: column;
`

const SmallHeader = styled.h3`
    font-family: 'Fira Code', sans-serif;
    font-size: 14px;
    color: ${colors.yellow};
`

const MainHeader = styled.h1`
    font-size: 80px;
    font-weight: 700;
    color: ${colors.light};

`

const SubHeader = styled.h2`
    font-size: 80px;
    font-weight: 700;
    color: ${colors.grey};
`

const DescriptionParagraph = styled.p`
    max-width: 600px;
    font-size: 20px;
    font-weight: 500;
    color: ${colors.grey};
    letter-spacing: 137,5%;
`

const TitleContainer = styled.div`
    margin: 10px 0 60px 0;
`

const Icons = styled.div`
    display: flex;
    margin-top: 80px;
`




const WelcomeSection = () => {
    return (
        <SectionContainer>
            <ContentContainer>
                <SmallHeader>Hello, I'm</SmallHeader>
                <TitleContainer>
                    <MainHeader>Dominik Jurasz</MainHeader>
                    <SubHeader>I build backend stuff.</SubHeader>
                </TitleContainer>
                <DescriptionParagraph>I'm a software engineer specializing in building (and occasionally designing) exceptional digital experiences. Currently, I'm focused on building accessible, human-centered products at Upstatement.</DescriptionParagraph>
                <Icons>
                    <FontAwesomeIcon 
                        icon={faGithub}
                        color={colors.light}
                        style={{margin:'0 20 0 0',width: '28px', height: '28px' }}
                    />
                    <FontAwesomeIcon 
                        icon={faLinkedin}
                        color={colors.light}
                        style={{margin:'0 0 0 0', width: '28px', height: '28px' }}
                    />
                </Icons>
            </ContentContainer>
        </SectionContainer>
    )
}

export default WelcomeSection;