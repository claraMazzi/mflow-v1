const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** At least one lowercase letter.
At least one uppercase letter.
At least one digit.
At least one special character from the set @$!%*?&.
Password with 6 to 25 characters, containing only allowed characters.
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,25}$/;

export {
    emailRegex,
    passwordRegex
}