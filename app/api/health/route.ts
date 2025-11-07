import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Test MongoDB Atlas connection
    await dbConnect();
    
    const connectionTime = Date.now() - startTime;
    
    // Get connection state
    const readyState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    // Get database info
    const db = mongoose.connection.db;
    const admin = db?.admin();
    
    let serverStatus = null;
    try {
      if (admin) {
        serverStatus = await admin.serverStatus();
      }
    } catch (error) {
      console.log('Could not get server status:', error);
    }
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        status: states[readyState as keyof typeof states] || 'unknown',
        connectionTime: `${connectionTime}ms`,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        readyState,
        // AWS MongoDB Atlas specific info
        cluster: process.env.MONGODB_URI?.includes('cluster0') ? 'cluster0' : 'unknown',
        region: process.env.AWS_REGION || 'not-specified',
        provider: 'MongoDB Atlas (AWS)'
      },
      server: {
        version: serverStatus?.version || 'unknown',
        uptime: serverStatus?.uptime ? `${serverStatus.uptime}s` : 'unknown',
        connections: serverStatus?.connections || 'unknown'
      },
      environment: process.env.NODE_ENV || 'unknown'
    };
    
    return NextResponse.json(health, { status: 200 });
    
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        type: error.constructor.name,
        // AWS specific error handling
        isNetworkError: error.message?.includes('serverSelection') || 
                       error.message?.includes('ECONNREFUSED') ||
                       error.message?.includes('timeout'),
        suggestion: error.message?.includes('IP') ? 
          'Check MongoDB Atlas IP whitelist settings' : 
          'Check MongoDB Atlas connection string and credentials'
      },
      database: {
        status: 'disconnected',
        provider: 'MongoDB Atlas (AWS)',
        region: process.env.AWS_REGION || 'not-specified'
      }
    }, { status: 503 });
  }
}