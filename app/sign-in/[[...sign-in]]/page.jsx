import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            {/* <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" /> */}
            <SignIn/>
        </div>
    );
}