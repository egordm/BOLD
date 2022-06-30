import { TabContext, TabPanel } from "@mui/lab"
import { Box, Tab, Tabs } from "@mui/material"
import React from "react";


export const VirtualizedTabs = (props: {
  value: string;
  tabs: {
    value: string;
    label: React.ReactNode;
  }[];
  onChange: (event: React.ChangeEvent<{}>, newValue: string) => void;
  renderTab: (value: string) => React.ReactNode;
}) => {
  const { value: selectedValue, onChange, ...rest } = props;

  return (
    <Box sx={{ width: '100%' }}>
      <TabContext value={selectedValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedValue} onChange={onChange}>
            {props.tabs.map(({ value, label }) => (
              <Tab key={value} value={value} label={label} />
            ))}
          </Tabs>
        </Box>
        {props.tabs.map(({ value, label }) => (
          <TabPanel key={value} value={value}>
            {selectedValue === value && props.renderTab(value)}
          </TabPanel>
        ))}
      </TabContext>
    </Box>
  )
}
