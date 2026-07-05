import { Box, CircularProgress, Typography } from "@mui/material";

function LoadingSpinner({ text = "Loading..." }) {
  return (
    <Box
      sx={{
        height: "60vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CircularProgress />

      <Typography
        sx={{
          mt: 2,
          color: "text.secondary",
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}

export default LoadingSpinner;