from pyteal import *

from gadgetmarket import Gadget

if __name__ == "__main__":
    approval_program = Gadget().approval_program()
    clear_program = Gadget().clear_program()

    # Mode.Application specifies that this is a smart contract
    compiled_approval = compileTeal(approval_program, Mode.Application, version=6)
    print(compiled_approval)
    with open("marketplace_approval.teal", "w") as teal:
        teal.write(compiled_approval)
        teal.close()

    # Mode.Application specifies that this is a smart contract
    compiled_clear = compileTeal(clear_program, Mode.Application, version=6)
    print(compiled_clear)
    with open("marketplace_clear.teal", "w") as teal:
        teal.write(compiled_clear)
        teal.close()