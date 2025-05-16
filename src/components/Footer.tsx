export default function Footer() {
  return (
    <footer className="py-6 mt-12 px-4 text-center border-t">
      <p className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Caffico Express. All rights reserved.
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Enjoy your caffeine confession!
      </p>
    </footer>
  );
}
