import PropTypes from "prop-types";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import glTable from "../glTable.module.scss";

const GLTableToolbar = ({
  numSelected,
  hiddenSelected,
  tableName,
  rowCount,
  enableRowSelect,
  children,
  titleActions,
  hasFilters,
}) => (
  <div>
    {tableName && (hasFilters || titleActions) && (
      <Toolbar
        className={`${glTable.titleContainer} ${enableRowSelect && numSelected > 0 ? glTable.rowSelectedTitleContainer : ""}`}
      >
        <div>
          {enableRowSelect && numSelected > 0 ? (
            <div data-test="tableToolbarTitle">
              <Typography variant="h6" color="textPrimary" component="div">
                {tableName}
                {" ("}
                {numSelected} {"selected)"}
              </Typography>
              {hiddenSelected > 0 && (
                <sup className={glTable.subtextWrapper}>
                  {hiddenSelected}
                  {" not shown on the current page"}
                </sup>
              )}
            </div>
          ) : (
            <Typography variant="h6" data-test="tableToolbarTitle" id="tableTitle" component="div">
              {tableName}
              {" ("}
              {rowCount}
              {")"}
            </Typography>
          )}
        </div>
        {titleActions}
      </Toolbar>
    )}
    {(hasFilters || titleActions) && <Divider />}
    <div>{children}</div>
  </div>
);

GLTableToolbar.defaultProps = {
  tableName: null,
  hiddenSelected: 0,
  numSelected: 0,
  rowCount: 0,
  children: <div />,
  enableRowSelect: true,
  titleActions: null,
  hasFilters: false,
};

GLTableToolbar.propTypes = {
  numSelected: PropTypes.number,
  rowCount: PropTypes.number,
  tableName: PropTypes.string,
  hiddenSelected: PropTypes.number,
  children: PropTypes.object,
  enableRowSelect: PropTypes.bool,
  titleActions: PropTypes.object,
  hasFilters: PropTypes.bool,
};

export default GLTableToolbar;
