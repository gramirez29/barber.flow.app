using FluentValidation;

namespace Barber.Flow.Api.DTOs.Requests;

public class BarberRequestValidator : AbstractValidator<BarberRequest>
{
    public BarberRequestValidator()
    {
        RuleFor(x => x.UserName)
            .NotEmpty().WithMessage("User name is required.");

        RuleFor(x => x.UserPhone)
            .NotEmpty().WithMessage("User phone is required.")
            .Matches(@"^\d{4}-\d{4}$").WithMessage("User phone must be in format 0000-0000.");

        RuleFor(x => x.UserEmail)
            .NotEmpty().WithMessage("User email is required.")
            .EmailAddress().WithMessage("User email must be a valid email address.");

        RuleFor(x => x.BarberName)
            .NotEmpty().WithMessage("Barber name is required.");

        RuleFor(x => x.BarberPhone)
            .NotEmpty().WithMessage("Barber phone is required.")
            .Matches(@"^\d{4}-\d{4}$").WithMessage("Barber phone must be in format 0000-0000.");
    }
}
