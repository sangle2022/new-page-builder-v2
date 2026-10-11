import React from "react";

const CongratulationsMessage = () => {
  return (
    <div
      style={{
        textAlign: "center",
        opacity: 0,
        animation: "fadeIn 1s forwards",
        fontFamily: "'Roboto Flex', sans-serif",
        padding: "40px 20px",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(50px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes popper {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .fas {
          font-family: 'Font Awesome 5 Free', sans-serif;
          font-weight: 900;
        }

        @import url('https://fonts.googleapis.com/css2?family=Roboto+Flex:wght@100;300;400;500;700;900&display=swap');
      `}</style>

      <div
        style={{
          fontSize: "100px",
          color: "#4caf50",
          marginBottom: "20px",
          animation: "popper 1s ease-out",
        }}
      >
        <i className="fas fa-check-circle" />
      </div>

      <h2
        style={{
          fontSize: "40px",
          fontWeight: 900,
          color: "rgb(20, 72, 151None)",
          marginBottom: "20px",
          animation: "fadeIn 1.5s ease-out",
        }}
      >
        Congratulations!
      </h2>

      <p
        style={{
          fontSize: "22px",
          color: "rgb(20, 72, 151None)",
          fontWeight: "bold",
          marginBottom: "30px",
          animation: "fadeIn 2s ease-out",
        }}
      >
        Your form has been successfully submitted.
      </p>
    </div>
  );
};

export default CongratulationsMessage;
