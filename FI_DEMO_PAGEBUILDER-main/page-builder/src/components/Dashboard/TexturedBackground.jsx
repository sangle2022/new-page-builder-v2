import React, { useState, useEffect } from 'react';
import { Row, Col, Typography } from 'antd';
import BuilderPNG from "../../FRISTINE2.png"; // Adjust the path based on your folder structure
import Typical from 'react-typical';

const { Text } = Typography;

const TexturedBackground = ({ title, description }) => {
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    // Set a timer to stop the typing animation after it completes the first cycle.
    const timer = setTimeout(() => {
      setIsTyping(false);
    }, 2000); // Adjust this duration based on the length of the title.

    return () => clearTimeout(timer); // Clean up the timer on component unmount.
  }, []);

  return (
    <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
      <Col span={24}>
        <div
          style={{
            position: 'relative',
            borderRadius: '12px',
            height: '170px', // Reduced height of the container
            background: `
              linear-gradient(
                135deg,
                rgba(49, 105, 190, 0.9),
                rgba(49, 105, 190, 0.7),
                rgba(45, 45, 112, 0.85)
              ),
              repeating-linear-gradient(
                45deg,
                #3169BE 0%,
                #1e3c72 15%,
                #1d2b64 25%,
                #2a5298 50%,
                #3169BE 75%
              )
            `,
            backgroundColor: '#3169BE',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Logo acting as a watermark */}
          <img
            src={BuilderPNG}
            alt="Fristine"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-80%, -50%)', // Center the watermark
              width: '100%', // Make it cover the entire width
              height: '100%', // Make it take up the full height of the container
              objectFit: 'contain', // Scale the logo without distorting it
              opacity: 0.1, // Make it very light for a watermark effect
              zIndex: 0, // Ensure it stays behind the text
            }}
          />
          <div
            style={{
              padding: '10px 20px',
              textAlign: 'center',
              borderRadius: '8px',
              color: '#ffffff',
              zIndex: 1, // Ensure the text is above the SVG
              backdropFilter: 'blur(4px)', // Adds a slight blur effect to the background for better text visibility
             background: 'rgba(0, 0, 0, 0.3)', // Adds a semi-transparent background for text contrast
            }}
          >
            {isTyping ? (
              <Typical
                steps={[title, 1000]}
                wrapper="h3"
                style={{
                  color: '#ffffff',
                  marginBottom: '8px',
                  fontSize: '20px', // Adjusted font size to fit reduced height
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)', // Adds a shadow for better readability
                }}
              />
            ) : (
              <h3
                style={{
                  color: '#ffffff',
                  marginBottom: '8px',
                  fontSize: '20px', // Adjusted font size to fit reduced height
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                }}
              >
                {title}
              </h3>
            )}
            <Text style={{ color: '#e0e0e0', fontSize: '14px', textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}>
              {description}
            </Text>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default TexturedBackground;
