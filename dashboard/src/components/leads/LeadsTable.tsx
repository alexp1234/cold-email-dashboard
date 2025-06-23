import { Paper, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, Link as MuiLink, } from "@mui/material"
import type { Lead } from "../../types/leads"
import { useMemo } from "react";

interface LeadsTableProps {
    leads: Lead[];
    page: number;
    onPageChange: (event: unknown, newPage: number) => void;
}

export const LeadsTable = ({ leads, page, onPageChange }: LeadsTableProps) => {
    const rowsPerPage = 10;

    const paginatedLeads = useMemo(() => {
          const start = page * rowsPerPage;
          return leads.slice(start, start + rowsPerPage);
    }, [leads, page]);
        
    return (
        <Paper
            sx={{
              width: '100%',
              overflowX: 'auto',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f3f4f6' }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Business Name</TableCell>
                  <TableCell>Campaign</TableCell>
                  <TableCell>Date Added</TableCell>
                  <TableCell>Instantly Link</TableCell>
                </TableRow>
              </TableHead>
    
              <TableBody>
                {paginatedLeads.map((lead) => {
                    return (
                        <TableRow
                            key={lead.id}
                            sx={{
                                bgcolor: '#ffffff',
                                '&:hover': { backgroundColor: '#f0f0f0' },
                            }}
                        >
                            <TableCell>{lead.name}</TableCell>
                            <TableCell>{lead.email}</TableCell>
                            <TableCell>{lead.company_name}</TableCell>
                            <TableCell>{lead.campaign}</TableCell>
                            <TableCell>
                                {new Date(lead.date_added).toLocaleDateString('en-US')}
                            </TableCell>
                            <TableCell>
                                <MuiLink
                                    href={`https://app.instantly.ai/leads/${lead.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Link
                                </MuiLink>
                            </TableCell>
                        </TableRow>
                    )
                })}
              </TableBody>
            </Table>
    
            <TablePagination
                component="div"
                count={leads.length}
                page={page}
                onPageChange={onPageChange}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[rowsPerPage]}
            />
        </Paper>
    )
}