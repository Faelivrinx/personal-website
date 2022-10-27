import * as React from 'react';
import styled from 'styled-components';
import { variables, typography } from '../values';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';

const sectionContent = {
    hello: "Hello, I'm",
    name: "Dominik Jurasz",
    profession: "I build backend stuff.",
    description: "I'm a software engineer specializing in building (and occasionally designing) exceptional digital experiences. Currently, I'm focused on building accessible, human-centered products at Upstatement.",
}

const SectionContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: ${variables.dark};
    border: 10px solid white;
`

const ContentContainer = styled.div`
    max-width: 900px;
    display: flex;
    flex-direction: column;
`

const SmallHeader = styled.h3`
    font-family: 'Fira Code', sans-serif;
    font-size: ${typography.s};
    color: ${variables.yellow};
`

const Header = styled.h1`
    font-size: ${typography.xxl};
    font-weight: 700;
    color: ${props => props.color ? props.color : variables.light};
`

const DescriptionParagraph = styled.p`
    max-width: 600px;
    font-size: ${typography.m};
    font-weight: 500;
    color: ${variables.grey};
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
                <SmallHeader>{sectionContent.hello}</SmallHeader>
                <TitleContainer>
                    <Header>{sectionContent.name}</Header>
                    <Header color={variables.grey}>{sectionContent.profession}</Header>
                </TitleContainer>
                <DescriptionParagraph>{sectionContent.description}</DescriptionParagraph>
                <Icons>
                    <FontAwesomeIcon 
                        icon={faGithub}
                        color={variables.light}
                        style={{margin:'0 20 0 0',width: '28px', height: '28px' }}
                    />
                    <FontAwesomeIcon 
                        icon={faLinkedin}
                        color={variables.light}
                        style={{margin:'0 0 0 0', width: '28px', height: '28px' }}
                    />
                </Icons>
            </ContentContainer>
        </SectionContainer>
    )
}

export default WelcomeSection;