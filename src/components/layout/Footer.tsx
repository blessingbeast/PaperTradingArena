
export function Footer() {
    return (
        <footer className="border-t bg-white dark:bg-gray-950 dark:border-gray-800 py-6 mt-auto">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} TradeSim India. For educational purposes only.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <a href="#" className="hover:text-blue-600">Privacy Policy</a>
                    <a href="#" className="hover:text-blue-600">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
}
