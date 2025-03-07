import ShippingDisplay from "./ShippingDisplay";
import MetaDataDisplay from "./MetaDataDisplay";
import OrderActionButtons from "./OrderActionButtons";
import OrderStatusButtons from "./OrderStatusButtons";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
const OrderDropdown = ({ row, determineColor, colspan }) => {
  return (
    <TableRow className="p-10px w-100per" style={{ backgroundColor: determineColor(row) }}>
      <TableCell colSpan={colspan} style={{ color: "white" }}>
        <Grid container spacing={2} className="paragraph_font">
          <Grid item xs={3}>
            <ShippingDisplay shipping={row.shipping} />
          </Grid>
          <Grid item xs={3}>
            <MetaDataDisplay row={row} />
          </Grid>
          <Grid item xs={3}>
            <OrderActionButtons order={row} />
          </Grid>
          <Grid item xs={3}>
            <OrderStatusButtons order={row} />
          </Grid>
          <Grid item xs={12}>
            {row?.change_log && row.change_log.length > 0 && (
              <>
                <Typography variant="h6">{"Change Log"}</Typography>
                {(row.change_log ? [...row.change_log] : [])
                  .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
                  .map((log, i) => (
                    <Paper key={i}>
                      <Box mt={2} p={2} display="flex" flexDirection="row">
                        <Typography variant="body1">
                          {new Date(log.changedAt).toLocaleString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          })}{" "}
                          {"- Changed By - "}
                          {log.changedBy}
                          {" - Change Description: "}
                          {log.change}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
              </>
            )}
          </Grid>
        </Grid>
      </TableCell>
    </TableRow>
  );
};

export default OrderDropdown;
