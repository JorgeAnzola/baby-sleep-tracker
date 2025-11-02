import { rateLimit } from '@/lib/rate-limit';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

interface HuckleberryRow {
  Type: string;
  Start: string;
  End: string;
  Duration: string;
  'Start Condition': string;
  'Start Location': string;
  'End Condition': string;
  Notes: string;
}

function parseHuckleberryDuration(duration: string): number {
  if (!duration) return 0;
  
  const parts = duration.split(':');
  if (parts.length !== 2) return 0;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  return (hours * 60) + minutes;
}

function parseHuckleberryDateTime(dateTime: string): Date | null {
  if (!dateTime) return null;
  
  try {
    // Format: "2025-10-25 13:54"
    const [datePart, timePart] = dateTime.split(' ');
    if (!datePart || !timePart) return null;
    
    // Parse as local time (Europe/Madrid timezone)
    // The dates in Huckleberry CSV are in local time, not UTC
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    // Create date in local timezone
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  } catch (error) {
    console.error('Error parsing date:', dateTime, error);
    return null;
  }
}

function determineSleepType(startTime: Date): 'NAP' | 'NIGHTTIME' {
  const hour = startTime.getHours();
  
  // Consider nighttime sleep if it starts between 6 PM and 6 AM
  if (hour >= 18 || hour < 6) {
    return 'NIGHTTIME';
  }
  
  return 'NAP';
}

function parseCsvContent(csvContent: string): HuckleberryRow[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.replace(/"/g, '').trim());
  
  // Parse data rows
  const rows: HuckleberryRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Simple CSV parsing - handling quoted fields
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add the last value
    
    // Create row object
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row as unknown as HuckleberryRow);
  }
  
  return rows;
}

export async function POST(request: NextRequest) {
  // Rate limiting: 10 CSV imports per hour per IP
  const rateLimitResponse = rateLimit(request, { 
    windowMs: 3600000, // 1 hour
    maxRequests: 10 
  });
  
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const babyId = formData.get('babyId') as string;
    
    if (!file) {
      return NextResponse.json({ 
        error: 'No file provided' 
      }, { status: 400 });
    }
    
    if (!babyId) {
      return NextResponse.json({ 
        error: 'Baby ID is required' 
      }, { status: 400 });
    }
    
    // Verify baby exists
    const baby = await prisma.baby.findUnique({
      where: { id: babyId }
    });
    
    if (!baby) {
      return NextResponse.json(
        { error: 'Baby not found' },
        { status: 404 }
      );
    }
    
    // Read and parse CSV content
    const csvContent = await file.text();
    const rows = parseCsvContent(csvContent);
    
    // Filter for sleep records only
    const sleepRows = rows.filter(row => row.Type === 'Sleep');
    
    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    
    // Process each sleep record
    for (const row of sleepRows) {
      try {
        const startTime = parseHuckleberryDateTime(row.Start);
        const endTime = parseHuckleberryDateTime(row.End);
        
        if (!startTime) {
          skippedCount++;
          errors.push(`Invalid start time: ${row.Start}`);
          continue;
        }
        
        // Skip if session already exists (based on start time and baby)
        const existingSession = await prisma.sleepSession.findFirst({
          where: {
            babyId: babyId,
            startTime: startTime
          }
        });
        
        if (existingSession) {
          skippedCount++;
          continue;
        }
        
        const duration = parseHuckleberryDuration(row.Duration);
        const sleepType = determineSleepType(startTime);
        
        // Create sleep session
        await prisma.sleepSession.create({
          data: {
            babyId: babyId,
            startTime: startTime,
            endTime: endTime,
            duration: duration > 0 ? duration : null,
            sleepType: sleepType,
            notes: row.Notes || null,
            location: row['Start Location'] || null
          }
        });
        
        importedCount++;
        
      } catch (error) {
        console.error('Error processing row:', row, error);
        errors.push(`Error processing record starting ${row.Start}: ${error}`);
        skippedCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Import completed successfully`,
      stats: {
        totalRecords: sleepRows.length,
        imported: importedCount,
        skipped: skippedCount,
        errors: errors.length
      },
      errors: errors.slice(0, 10) // Return first 10 errors only
    });
    
  } catch (error) {
    console.error('CSV Import Error:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV file' },
      { status: 500 }
    );
  }
}