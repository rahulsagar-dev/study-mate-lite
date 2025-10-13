export const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} StudyMate Lite. All rights reserved.
        </div>
      </div>
    </footer>
  );
};