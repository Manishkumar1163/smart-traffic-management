import React from 'react';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Skeleton from '@mui/material/Skeleton';

/**
 * Animated Table Skeleton Loader for SaaS styling
 * @param {number} cols Number of columns
 * @param {number} rows Number of rows
 */
export default function TableSkeleton({ cols = 6, rows = 5 }) {
  return (
    <>
      {[...Array(rows)].map((_, rIdx) => (
        <TableRow key={rIdx}>
          {[...Array(cols)].map((_, cIdx) => (
            <TableCell key={cIdx}>
              <Skeleton 
                variant="rounded" 
                height={20} 
                width={cIdx === 0 ? "50%" : cIdx === cols - 1 ? "30%" : "85%"}
                sx={{ borderRadius: 1.5, opacity: 0.6 }} 
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
