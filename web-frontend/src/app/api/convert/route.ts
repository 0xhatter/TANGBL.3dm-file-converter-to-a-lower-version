import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execPromise = promisify(exec);
const writeFilePromise = promisify(fs.writeFile);
const unlinkPromise = promisify(fs.unlink);
const mkdirPromise = promisify(fs.mkdir);

export async function POST(request: NextRequest) {
  try {
    // Get form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetVersion = formData.get('targetVersion') as string;

    if (!file || !targetVersion) {
      return NextResponse.json(
        { error: 'File and target version are required' },
        { status: 400 }
      );
    }

    // Create temp directory for processing
    const tempDir = path.join(os.tmpdir(), 'rhino-converter');
    // Create directory if it doesn't exist, ignore errors if it already exists
    await mkdirPromise(tempDir, { recursive: true }).catch(() => {});


    // Save the uploaded file to a temporary location
    const inputFilePath = path.join(tempDir, file.name);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFilePromise(inputFilePath, fileBuffer);

    // Define output file path
    const fileNameWithoutExt = file.name.replace(/\.3dm$/i, '');
    const outputFilePath = path.join(tempDir, `${fileNameWithoutExt}_v${targetVersion}.3dm`);

    // Get the path to the Python converter script
    const converterScriptPath = path.join(process.cwd(), '..', '3dm_version_converter', 'converter.py');

    // Execute the Python converter script
    const { stdout, stderr } = await execPromise(
      `python "${converterScriptPath}" "${inputFilePath}" -v ${targetVersion} -o "${outputFilePath}"`
    );

    console.log('Conversion stdout:', stdout);
    if (stderr) {
      console.error('Conversion stderr:', stderr);
    }

    // Check if the output file exists
    if (!fs.existsSync(outputFilePath)) {
      throw new Error('Conversion failed: Output file not created');
    }

    // Read the converted file
    const convertedFileBuffer = fs.readFileSync(outputFilePath);

    // Clean up temporary files
    try {
      await unlinkPromise(inputFilePath);
      await unlinkPromise(outputFilePath);
    } catch (err) {
      console.error('Error cleaning up temp files:', err);
    }

    // Return the converted file
    return new NextResponse(convertedFileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileNameWithoutExt}_v${targetVersion}.3dm"`,
      },
    });
  } catch (error) {
    console.error('Error during conversion:', error);
    return NextResponse.json(
      { error: 'Failed to convert file' },
      { status: 500 }
    );
  }
}
