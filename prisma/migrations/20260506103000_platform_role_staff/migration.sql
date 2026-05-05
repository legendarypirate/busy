-- Staff roles for scoped admin panels (super_admin, trip_manager, event_manager).
ALTER TYPE "PlatformRole" ADD VALUE 'super_admin';
ALTER TYPE "PlatformRole" ADD VALUE 'trip_manager';
ALTER TYPE "PlatformRole" ADD VALUE 'event_manager';
