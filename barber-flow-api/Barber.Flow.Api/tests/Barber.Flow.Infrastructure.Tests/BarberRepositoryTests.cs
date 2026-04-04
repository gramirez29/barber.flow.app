using System.Threading.Tasks;
using Barber.Flow.Infrastructure.Services.InMemory;
using Barber.Flow.Domain.Entities;
using Xunit;

namespace Barber.Flow.Infrastructure.Tests;

public class BarberRepositoryTests
{
    [Fact]
    public async Task GetNextId_IsPeekAndCreateUsesSameId()
    {
        var repo = new InMemoryBarberRepository();

        var peek = await repo.GetNextIdAsync();

        var created = await repo.CreateAsync(new Barber.Flow.Domain.Entities.Barber { UserName = "Test", BarberName = "T" });

        Assert.Equal(peek, created.Id);

        var nextPeek = await repo.GetNextIdAsync();

        // nextPeek should be the created id + 1 (sequence advanced by CreateAsync)
        // parse numeric suffix
        int ParseSeq(string id) => int.Parse(id.Substring(4));

        var createdSeq = ParseSeq(created.Id);
        var nextSeq = ParseSeq(nextPeek);

        Assert.Equal(createdSeq + 1, nextSeq);
    }
}
